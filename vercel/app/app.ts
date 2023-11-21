import {NextResponse} from "next/server";

export class App {
  getFullName(person: { middle_name: string, first_name: string, last_name: string }) {
    if (!person.middle_name) {
      return `${person.first_name} ${person.last_name}`;
    } else {
      return `${person.first_name} ${person.middle_name} ${person.last_name}`;
    }
  }

  async setupInsertMovie() {
    let msg = "Not implemented";
    return NextResponse.json({msg}, {status: 501});
  }

  async insertMovie(val: { prefix: string, people: [number] }) {
    let msg = "Not implemented";
    return NextResponse.json({msg}, {status: 501});
  }

  async setupGetMovie(number_of_ids: number) {
    let msg = "Not implemented";
    return NextResponse.json({msg}, {status: 501});
  }

  async getMovie(id: number) {
    let msg = "Not implemented";
    return NextResponse.json({msg}, {status: 501});
  }

  async setupGetUser(number_of_ids: number) {
    let msg = "Not implemented";
    return NextResponse.json({msg}, {status: 501});
  }

  async getUser(id: number) {
    let msg = "Not implemented";
    return NextResponse.json({msg}, {status: 501});
  }
}
